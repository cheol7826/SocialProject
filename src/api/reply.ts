import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";

export const replyScheme = yup.object({
    body: yup.string().required(),
    good: yup.number().default(0)
});


async function insertComment(req:Request, res: Response) {
    try{
        const {
            body,
            good
        } = replyScheme.validateSync(req.body);

        const board_id = req.body.boardId;
        const user_id = req.session.userId;

        const rows = await db('INSERT INTO reply (body, user_id, good, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?, ?)',
         [body, user_id, good, board_id, 0, 0]);

        const data = JSON.parse(JSON.stringify(rows));

        await db('UPDATE reply SET parent_id=? WHERE reply_id=?', [data.insertId, data.insertId]);
        res.json({
            success: true,
            msg: '댓글 작성 완료'
        })
    } catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 작성 실패'
        })
    }
}

async function insertSubComment(req:Request, res: Response) {
    try{
        const parent_id = req.params.replyId;
        const board_id = req.body.boardId;
        const user_id = req.session.userId;
        const {
            body,
            good,
        } = replyScheme.validateSync(req.body);


        const rows = await db('INSERT INTO reply (body, user_id, good, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?, ?)',
         [body, user_id, good, board_id, parent_id, 1]);

        res.json({
            success: true,
            msg: '댓글 작성 완료'
        })

    } catch(error){
        res.status(400).send({
        success: false,
        msg: '댓글 작성 실패'
    })
    }
}

async function readAllComment(req:Request, res: Response) {
    try{
        const boardId = req.body.boardId;
        const rows = await db("SELECT * FROM reply WHERE board_id=? order by parent_id, level, regdate", [boardId]);

        var data = JSON.parse(JSON.stringify(rows));

        var tree = [];
        var cnt = -1;
        for(var d=0; d<data.length; d++){
            if(data[d].level === 0){
                tree.push({
                    data: data[d],
                    child: []
                })
                cnt++;
            } else{
                if(cnt !== -1)
                tree[cnt].child.push(data[d]);
            }
        }
        res.json(tree);
        
    } catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 검색 실패'
        })
    }
}

async function updateComment(req: Request, res: Response){
    try{
        const user_id = req.session.userId;
        const reply_id = req.params.replyId;
        const {
            body,
            good,
        } = replyScheme.validateSync(req.body);

        const check = await db('SELECT reply_id FROM reply WHERE reply_id=? and user_id=?', [reply_id, user_id]);

        if(!check[0]) return res.status(400).send({msg : '사용자가 일치하지 않습니다.'})

        const rows = await db('UPDATE reply SET body=? WHERE reply_id = ?', [body, reply_id]);

        res.json({
            success: true,
            msg: '댓글 수정 성공'
        });
    }
    catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 수정 실패'
        })
    }


}

async function deleteComment(req: Request, res: Response){
    try{
        const user_id = req.session.userId;
        const reply_id = req.params.replyId;
        const check = await db('SELECT reply_id FROM reply WHERE reply_id=? and user_id=?', [reply_id, user_id]);

        if(!check[0]) return res.status(400).send({msg : '사용자가 일치하지 않습니다.'})

        const rows = await db('DELETE FROM reply WHERE reply_id=? OR parent_id=?', [reply_id, reply_id]);

        res.json({
            success: true,
            msg: '댓글 삭제 성공'
        })
    } catch(error){
        res.status(400).send({
            success: false,
            msg: '댓글 삭제 실패'
        })
    }
}

function loginCheck(req: Request, res: Response, next: NextFunction){
    if(req.session.isLogedIn){
      next();
    } else{
      return res.json({
        success: false,
        msg: '로그인이 필요합니다'
      })
    }
  }


const router = Router();
router.post('/', loginCheck, insertComment);
router.post('/:replyId', loginCheck, insertSubComment);
router.get('/', readAllComment);
router.put('/:replyId', loginCheck, updateComment);
router.delete('/:replyId', loginCheck, deleteComment);

export default router

